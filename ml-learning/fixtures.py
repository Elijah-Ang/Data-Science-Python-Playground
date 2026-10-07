"""Versioned, deterministic learning populations. No learner state is stored."""
import numpy as np
import pandas as pd

FIXTURE_VERSION = 3

def learning_fixture(name):
    if name == 'CHANNEL8':
        return pd.DataFrame({'channel':['email','phone','chat','email','chat','phone','kiosk','email'],
                             'batch':['training']*5+['incoming']*3},
                            index=['t0','t1','t2','t3','t4','known','new','repeat'])
    if name.startswith('ML-X'):
        return pd.read_csv('data/ml-learning/'+name+'.csv')
    if name == 'ERROR15':
        return pd.DataFrame({'actual':['A']*7+['B']*4+['C']*4,
                             'predicted':['A']*5+['B']*2+['A']+['B']*3+['A']*2+['B']*2},
                            index=np.arange(501,516))
    if name == 'ERROR12_REVIEW':
        return pd.DataFrame({'actual':['clear']*18+['inspect']*6+['urgent']*3,
            'predicted':['clear']*18+['inspect']*4+['clear']*2+['clear']*3,
            'alternative':['clear']*15+['inspect']*2+['urgent']+['inspect']*5+['clear']+['urgent']*2+['inspect']},
            index=np.arange(700,754,2))
    if name == 'RULE24_REVIEW':
        position=np.arange(36)
        code=np.resize([2,2,7,4,2,4],36)
        fragile=position%2
        audit=(code==7)|((code==4)&(fragile==1))
        audit[[5,14,29]]=~audit[[5,14,29]]
        return pd.DataFrame({'distance':np.resize([3.,11.,6.,15.,9.,21.,5.,17.,13.],36),
                             'fragile':fragile,'service_code':code,
                             'label':np.where(audit,'audit','release')},index=900+position*3)
    if name == 'MATERIAL96':
        rng=np.random.default_rng(159)
        counts=[48,30,18]
        values=np.vstack([rng.multivariate_normal(mean,cov,count)
            for mean,cov,count in zip([(2.5,.35),(7.1,3.),(1.1,.05)],
                [[[.16,.02],[.02,.09]],[[.49,.12],[.12,.64]],[[.09,.005],[.005,.01]]],counts)])
        return pd.DataFrame({'density_g_cm3':values[:,0],'conductivity_ms':(values[:,1]+1)*1000,
                             'material':np.repeat(['glass','metal','polymer'],counts)},
                             index=1200+np.arange(96)*7)
    if name == 'INTAKE48':
        rng=np.random.default_rng(531)
        backlog=rng.integers(0,14,48); age=rng.uniform(1,9,48)
        hours=2+.85*backlog+.55*age+rng.normal(0,1.2,48)
        return pd.DataFrame({'case_id':np.arange(4100,4148),'backlog_at_open':backlog,'device_age_years':age,'completion_hours':hours,'invoice_hours':hours+.25})
    if name == 'LAB90':
        rng=np.random.default_rng(642)
        n=np.array([63,18,9]); labels=np.repeat(['routine','watch','urgent'],n)
        signal=np.concatenate([rng.normal(m,.7,k) for m,k in zip([0,1.1,2.2],n)])
        speed=np.concatenate([rng.normal(m,5,k) for m,k in zip([50,65,75],n)])
        return pd.DataFrame({'sample_id':np.arange(7000,7090),'signal':signal,'speed_rpm':speed,'status':labels,'confirmed_urgent':(labels=='urgent').astype(int)})
    if name == 'PROCESS30':
        rng=np.random.default_rng(753)
        temperature=np.r_[rng.normal(20,2,24),rng.normal(39,1.5,6)]
        pressure=np.r_[rng.normal(2.0,.15,24),rng.normal(2.8,.08,6)]
        output=15+1.5*temperature+8*pressure+rng.normal(0,1,30)
        return pd.DataFrame({'temperature_c':temperature,'pressure_bar':pressure,'output':output})
    if name == 'CUBIC60':
        rng=np.random.default_rng(864)
        x=np.linspace(-2.5,2.5,60)
        return pd.DataFrame({'x':x,'y':6+1.4*x-.4*x*x+1.8*x**3+rng.normal(0,.8,60)})
    if name == 'CUBIC60':
        rng=np.random.default_rng(864)
        x=np.linspace(-2.5,2.5,60)
        return pd.DataFrame({'x':x,'y':6+1.4*x-.4*x*x+1.8*x**3+rng.normal(0,.8,60)})
    if name == 'CLUSTER45_ANISO':
        rng=np.random.default_rng(865)
        groups=[rng.multivariate_normal(center,cov,n) for center,cov,n in
                [((1,1),[[.45,.18],[.18,.09]],22),((4,1),[[.08,-.12],[-.12,.5]],15),((2.3,4),[[.2,0],[0,.06]],8)]]
        values=np.vstack(groups)
        return pd.DataFrame({'length_mm':(values[:,0]+3)*1000,'width_cm':(values[:,1]+3)*10},index=pd.Index(2001+np.arange(45)*3,name='item_id'))
    if name == 'PCA60_MIXED':
        rng=np.random.default_rng(976)
        z1,z2,z3,noise=rng.normal(size=(4,60))
        return pd.DataFrame({'a':100+10*z1,'b':50+5*z1+3*z3,'c':20+4*z2,'d':40+6*z2+5*z3,'e':noise},index=pd.Index(3101+np.arange(60)*5,name='sensor_id'))
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
    if name in ('ENERGY72', 'SUPPORT120', 'REPAIR96', 'SENSOR150'):
        seeds={'ENERGY72':121,'SUPPORT120':232,'REPAIR96':343,'SENSOR150':454}
        rng=np.random.default_rng(seeds[name])
        n={'ENERGY72':72,'SUPPORT120':120,'REPAIR96':96,'SENSOR150':150}[name]
        if name=='ENERGY72':
            area=rng.uniform(25,180,n); occupants=rng.integers(1,6,n)
            use=40+1.8*area+15*occupants+rng.normal(0,22,n)
            return pd.DataFrame({'area_m2':area,'occupants':occupants,'monthly_kwh':use,'end_month_bill':use*.3})
        if name=='SUPPORT120':
            queue=rng.integers(0,35,n); age=rng.uniform(0,8,n)
            late=np.where(queue+3*age+rng.normal(0,9,n)>43,'late','on_time')
            return pd.DataFrame({'queue_at_open':queue,'age_hours_at_open':age,'resolution':late,'closed_late_flag':(late=='late').astype(int)})
        if name=='REPAIR96':
            jobs=rng.integers(0,15,n); age=rng.uniform(1,12,n)
            hours=3+1.5*jobs+.7*age+rng.normal(0,2,n)
            return pd.DataFrame({'ticket_id':np.arange(9000,9000+n),'jobs_waiting':jobs,'device_age_years':age,'repair_hours':hours,'invoice_labor_hours':hours+.2})
        vibration=rng.uniform(0,8,n); temperature=rng.uniform(18,70,n)
        failure=np.where(vibration+.07*temperature+rng.normal(0,1.5,n)>9,'fault','normal')
        return pd.DataFrame({'unit_id':np.arange(3000,3000+n),'vibration_mm_s':vibration,'temperature_c':temperature,'next_week_state':failure,'replacement_authorized':(failure=='fault').astype(int)})
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
