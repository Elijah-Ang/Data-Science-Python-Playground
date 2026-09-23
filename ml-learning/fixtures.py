"""Versioned, deterministic learning populations. No learner state is stored."""
import numpy as np
import pandas as pd

FIXTURE_VERSION = 1

def learning_fixture(name):
    if name.startswith('ML-X'):
        return pd.read_csv('data/ml-learning/'+name+'.csv')
    if name.endswith('_REVIEW'):
        base=name.removesuffix('_REVIEW')
        df=learning_fixture(base).copy()
        # Retrieval uses a different population/order, retaining each taught schema.
        # Sampling preserves legitimate input/target relationships in real datasets.
        if base in ('candy_class','penguins'):
            return df.sample(frac=.8,random_state=73).reset_index(drop=True)
        if base=='ERROR12':
            df['predicted']=np.roll(df.predicted.to_numpy(),2)
        else:
            rng=np.random.default_rng(73)
            for c in df.select_dtypes(include='number'):
                if c in ('weekend','fragile','hour') or base=='RULE24':continue
                if df[c].nunique()>4:df[c]+=rng.normal(0,float(df[c].std())*.05,len(df))
        return df
    rng = np.random.default_rng(42)
    if name == 'LINE12':
        return pd.DataFrame({'distance':[1,2,2,3,4,5,5,6,7,8,9,10], 'duration':[8,11,13,14,20,22,24,25,31,33,35,41]})
    if name in ('LINE24', 'LINE24B'):
        x = np.linspace(1,12,24)
        noise = np.random.default_rng(41 if name == 'LINE24' else 43).normal(0,3,24)
        return pd.DataFrame({'distance':x, 'duration':6+3*x+noise})
    if name in ('MIX60','MISSING60'):
        x,w = rng.uniform(1,20,60),rng.uniform(.2,10,60)
        service = np.resize(['standard','express','economy'],60)
        weekend = np.arange(60)%2
        effects = pd.Series(service).map({'standard':0,'express':-4,'economy':5}).to_numpy()
        df = pd.DataFrame({'distance':x,'weight':w,'service':service,'weekend':weekend,'duration':8+2.5*x+1.2*w+effects+3*weekend+rng.normal(0,4,60)})
        if name == 'MISSING60':
            df.loc[[2,11,28],'distance']=np.nan
            df.loc[[7,39],'service']=np.nan
        return df
    if name in ('CLASS18','CLASS180'):
        n = 6 if name == 'CLASS18' else 60
        x = np.vstack([rng.multivariate_normal(mean,.6*np.eye(2),n) for mean in [(0,0),(2,1),(0,3)]])
        return pd.DataFrame({'length':x[:,0]*1000,'width':x[:,1],'label':np.repeat(['A','B','C'],n)})
    if name == 'ERROR12':
        return pd.DataFrame({'actual':['A']*8+['B']*4,'predicted':['A']*7+['B']+['A']*3+['B']})
    if name == 'CURVE48':
        x=np.linspace(-3,3,48)
        return pd.DataFrame({'x':x,'y':8+2*x+1.5*x*x+rng.normal(0,1.5,48)})
    if name == 'STEP60':
        x=np.linspace(0,10,60)
        return pd.DataFrame({'x':x,'y':10+8*(x>4)-5*(x>7)+rng.normal(0,1.5,60)})
    if name == 'RULE24':
        service=np.resize(['standard','express','economy'],24)
        late=service=='economy';late[[5,11,17,23]]=~late[[5,11,17,23]]
        return pd.DataFrame({'distance':np.arange(1,25),'service':service,'fragile':np.arange(24)%2,'label':np.where(late,'late','on time')})
    if name in ('COV90','COV90_SHARED'):
        covs=[[[1,.7],[.7,1]],[[1,-.7],[-.7,1]]] if name=='COV90' else [[[1,.5],[.5,1]]]*2
        x=np.vstack([rng.multivariate_normal(mean,cov,45) for mean,cov in zip([(-1,0),(1,0)],covs)])
        return pd.DataFrame({'x1':x[:,0],'x2':x[:,1],'label':np.repeat(['A','B'],45)})
    if name in ('CLUSTER36','CLUSTER36B'):
        if name.endswith('B'): rng=np.random.default_rng(43)
        x=np.vstack([rng.normal(center,.35,(12,2)) for center in [(1,1),(4,1),(2,4)]])
        return pd.DataFrame({'length_mm':x[:,0]*1000,'width_cm':x[:,1]*10})
    if name == 'PCA48':
        z1,z2=rng.normal(size=(2,48)); e=rng.normal(size=(3,48))
        return pd.DataFrame({'a':100+10*z1,'b':50+5*z1+.5*e[0],'c':20+4*z2,'d':40+8*z2+e[1],'e':z1+z2+.2*e[2]})
    if name == 'TIME240':
        hours=np.arange(240); temp=20+6*np.sin(2*np.pi*hours/24)
        return pd.DataFrame({'time':pd.date_range('2026-01-01',periods=240,freq='h'),'hour':hours%24,'temperature':temp,'demand':100+4*temp+hours*.2+rng.normal(0,8,240)})
    paths={'breast':('data/breast-cancer.csv',','),'penguins':('data/palmer-penguins.csv',','),'car':('data/car-evaluation.csv',','),'candy':('data/candy-power-ranking.csv',','),'candy_class':('data/candy-power-ranking.csv',','),'wine':('data/wine-quality.csv',';'),'Wine600':('data/wine-quality.csv',';'),'gapminder':('data/gapminder.csv',','),'seoul':('data/seoul-bike.csv',',')}
    filename,sep=paths[name]
    df=pd.read_csv(filename,sep=sep)
    if name in ('wine','Wine600'):
        df=df.drop_duplicates().reset_index(drop=True)
        if name=='Wine600':df=df.sample(600,random_state=42).reset_index(drop=True)
    if name=='gapminder':df=df.loc[df.year.eq(2007)].reset_index(drop=True)
    if name=='candy_class':df['popular']=np.where(df.winpercent>=50,'50% or above','below 50%')
    if name=='seoul':df=df.assign(_date=pd.to_datetime(df.Date,dayfirst=True)).sort_values(['_date','Hour']).reset_index(drop=True)
    return df
